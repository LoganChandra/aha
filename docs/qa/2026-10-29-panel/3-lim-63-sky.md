# Blind persona QA: Mrs Lim, 63, retired science teacher: why the sky is blue

Panel run 2026-10-29 on https://profai-poc.vercel.app. Reviewer: fresh Sonnet subagent, blind to code. Screenshots: ~/profai/qa-shots/2026-10-29/lim/ (kept out of git).

I stopped after the last lesson and the lesson list because Mrs Lim had what she came for. I drove the site in about 60 actions: all 4 lessons, plus one follow-up question. Everything below is from screenshots and the visible text.

All screenshots are in `~/profai/qa-shots/2026-10-29/lim/`. I call that folder `S` and give each file as `S/NNN.png`.

## 1. Her story (first person)

My grandson asked why the sky is blue and I mumbled something about the sea. This time I wanted to do it properly. The page asked "What do you want to understand?", and I chose "Beginner – Know a little" (`~/profai/qa-shots/2026-10-29/lim/001.png`). I typed my question with proper capitals and a question mark, then tapped the arrow.

It said "Building your course" and showed two ticks, which I liked. It told me what it was doing.

Lesson 1 gave me a rainbow bar and a marker to drag. The label under the left end said "red 700 nm", but when I dragged the marker to the red end the number said 407 nm (`~/profai/qa-shots/2026-10-29/lim/008.png`). I thought I was doing it wrong. I pressed "Show me", and the marker jumped to the blue end while the text said "Red light has a long wavelength" (`~/profai/qa-shots/2026-10-29/lim/011.png`). Then it told me to drag to violet. When I went to the violet end it showed 694 nm. When I went the other way, to red, it said "Yes. Violet is the shortest" (`~/profai/qa-shots/2026-10-29/lim/015.png`). I taught for 34 years and I know red is the long one. I didn't trust it after that, but I carried on.

Lesson 2 had little atoms with arrows. I tapped three times and it said "Not that one" each time. I pressed "Show me" and it moved on. The slider part was good: shorter wavelength, more scattering. It jumped my slider by itself twice, and I don't like that.

Lesson 3 was a graph with three curves and labels sitting on top of each other. I don't wear my good glasses to read graphs. The point made sense, though: violet scatters most but our eyes see it poorly.

Lesson 4 showed the Sun and a line to my eye. The numbers next to "path through air" were blank. The picture never turned red. The text said it did.

I asked a follow-up in my own words. The answer never appeared on my screen.

If I had to teach it this weekend I could manage, but only because I already knew most of it.

## 2. Every moment she was confused, unsure or uneasy

1. **Level choice is already made.** `~/profai/qa-shots/2026-10-29/lim/001.png` shows "Beginner" pre-selected, black and filled, with no word about it. I tapped it and nothing seemed to change. She expected to be asked. Instead she wondered if her tap counted. Fix: state "Beginner is chosen for you. Tap another to change." Or leave all five unselected until she picks one.

2. **Unexplained jargon at the start.** In `~/profai/qa-shots/2026-10-29/lim/007.png`, "wavelength: 550 nm", "nm", "sunlight" and "drag me" appear with no explanation. She expected "nanometre" to be defined, or at least "wavelength = how long each light wave is". She read "nm" as maybe "nanometres?", but no one said so. Fix: one plain sentence before the bar (wavelength is the length of one wave of light, and a nanometre is a very tiny unit of length). Or label it "length of the light wave".

3. **The wavelength readout runs backwards.** This is the worst problem in the whole product. In `~/profai/qa-shots/2026-10-29/lim/008.png` and `~/profai/qa-shots/2026-10-29/lim/009.png`, the marker is at the red end (label "red 700 nm") and the readout says 407 and then 400 nm. In `~/profai/qa-shots/2026-10-29/lim/014.png`, the right end (labelled "violet 400 nm") reads 694 nm. In `~/profai/qa-shots/2026-10-29/lim/018.png`, on the blue stripe, it reads 670 nm. At the same time, the confirmations say "about 420 nm" and "around 470 nm". She expected the number to match the label at the end she was touching. She thought "either I am doing this wrong or this is wrong". For a teacher, a visibly wrong number destroys trust in everything after it. Fix: make the readout follow the bar (left = 700, right = 400). Then test every position against its label.

4. **"Show me" contradicts the picture.** In `~/profai/qa-shots/2026-10-29/lim/011.png`, the marker sits on the blue end, the readout says 650 nm, and the green banner says "Red light has a long wavelength". Nothing on the screen agrees with anything else. Fix: "Show me" must put the marker on the red end of the bar and then say the sentence.

5. **The arrow and the instruction disagree.** In `~/profai/qa-shots/2026-10-29/lim/007.png` the instruction says "drag to the red end", but the big blue hint arrow points right, toward violet. In `~/profai/qa-shots/2026-10-29/lim/013.png` the instruction says "drag to the violet end", but the arrow points left. She expected the arrow to show where to go. Fix: the arrow must point toward the target.

6. **"Blue light sits in between" (`~/profai/qa-shots/2026-10-29/lim/017.png`) is not what the bar shows.** Blue is the last stripe on the right, beside violet. Fix: say "Blue is next to violet at the short-wave end."

7. **The marker moves on its own.** In `~/profai/qa-shots/2026-10-29/lim/022.png`, after the quiz answer, the marker jumped to the middle (550 nm) with no touch. In `~/profai/qa-shots/2026-10-29/lim/043.png`, the wavelength changed to 450 by itself. In `~/profai/qa-shots/2026-10-29/lim/092.png`, the Sun height changed to 2° by itself when she only touched the dust slider. She is uneasy when things move without her asking. Fix: never move a control the person has touched without saying so ("I've moved it to show you").

8. **"Tap an air molecule" refused three correct taps** (`~/profai/qa-shots/2026-10-29/lim/030.png`, `~/profai/qa-shots/2026-10-29/lim/032.png`, then `~/profai/qa-shots/2026-10-29/lim/034.png`). The message "Not that one. Tap one of the air molecules." appeared even though she tapped the drawn molecules. I can't tell which target counted. She thought "Is my finger too big?" and gave up on the third try. Fix: make the whole molecule circle, plus a margin of about 12 px, a valid target. Or let any tap on the diagram's molecules count. At minimum, point out which one to tap.

9. **The "Not that one" message on the sunlight beam** (`~/profai/qa-shots/2026-10-29/lim/080.png`) was my own tap missing the thin line, but that is the point. A 3 px orange line is not tappable with a fingertip. Fix: widen the hit area to at least 44 px.

10. **The layout jumps up and down.** Between `~/profai/qa-shots/2026-10-29/lim/028.png` and `~/profai/qa-shots/2026-10-29/lim/030.png`, the diagram moved about 16 px up as the hint box changed. In `~/profai/qa-shots/2026-10-29/lim/091.png` and `~/profai/qa-shots/2026-10-29/lim/092.png`, the sky box and sliders shifted again. Fix: reserve fixed space for the banner and hint so the diagram never moves.

11. **Two numbers in the text and the display disagree.** In `~/profai/qa-shots/2026-10-29/lim/039.png` the banner says "At 450 nm…" while the readout says 490 nm. In `~/profai/qa-shots/2026-10-29/lim/069.png`/`~/profai/qa-shots/2026-10-29/lim/071.png`, the instruction says "around 470 nm" and "show me" puts it at about 85% and 35%, which then gets called "our eyes see it strongly". 35% is not strongly. Fix: make the number shown equal the number in the sentence, or drop the sentence's number.

12. **Lesson 2's quiz answer doesn't match the screen.** The quiz says blue scatters "5 to 6 times" more than red. The screen showed 100% for blue and 23% for red (`~/profai/qa-shots/2026-10-29/lim/045.png`), which is 4.3 times. A physics teacher checks this and finds it overstated. The correct answer for 450 against 650 nm is about 4 times (1.44⁴ ≈ 4.3). Fix: change the answer to "about 4 times", or compare the 700 nm end only (about 6 times).

13. **Lesson 3 is overloaded.** `~/profai/qa-shots/2026-10-29/lim/052.png`, `~/profai/qa-shots/2026-10-29/lim/056.png` and `~/profai/qa-shots/2026-10-29/lim/060.png` show three curves, a dashed line, a red dot, a "scattered: 45%" label and an "eye sees: 100%" label. In `~/profai/qa-shots/2026-10-29/lim/058.png` and `~/profai/qa-shots/2026-10-29/lim/066.png`, "you are here" overlaps "scattered: 95%". The dot hides behind the labels. At the violet end it says "scattered: 132%" and "152%" (`~/profai/qa-shots/2026-10-29/lim/067.png`). She can't see how a share of something is more than 100%. Fix: show one curve at a time, keep the labels clear of each other, and cap or explain percentages over 100.

14. **Dragging on the graph is sluggish.** I needed four drags (`~/profai/qa-shots/2026-10-29/lim/061.png`, `~/profai/qa-shots/2026-10-29/lim/063.png`, `~/profai/qa-shots/2026-10-29/lim/064.png`, `~/profai/qa-shots/2026-10-29/lim/066.png`) and the dot still only reached about 435 nm. The "drag the red dot to the far left" instruction was never completed. She used "Show me". Fix: make the dot follow the finger directly, and let a tap anywhere on the graph move it there.

15. **Lesson 4's readouts are blank.** In `~/profai/qa-shots/2026-10-29/lim/078.png`, `~/profai/qa-shots/2026-10-29/lim/085.png` and `~/profai/qa-shots/2026-10-29/lim/092.png`, "path through air:", "blue scattered away:" and "red reaching you:" have no numbers beside them. She expected figures or bars. She thought the page hadn't loaded properly. Fix: show a value or a small bar for each, e.g. "path through air: 1x" at noon and "path through air: 12x" at sunset.

16. **The sunset picture is not a sunset.** In `~/profai/qa-shots/2026-10-29/lim/085.png`, `~/profai/qa-shots/2026-10-29/lim/091.png` and `~/profai/qa-shots/2026-10-29/lim/092.png`, the box is pale teal at 70°, at 0° and at "dust 0.85". The text says "watch the sunset deepen" and "a redder, more dramatic sunset". Nothing deepens and nothing turns red. Fix: change the sky colour with the controls (blue at noon, orange and red at the horizon, deeper with dust).

17. **The Sun placement contradicts the story.** In `~/profai/qa-shots/2026-10-29/lim/078.png` the beam goes from a Sun in the upper right to an eye in the lower left. The text says "The Sun is high. Its light comes almost straight down". At 0° (`~/profai/qa-shots/2026-10-29/lim/085.png`) the Sun is stuck at the bottom corner with the eye beside it, and "your eye" is cut by the box border. Fix: draw the eye at the bottom centre with the Sun directly overhead at noon. Draw a thick atmosphere layer so a long slanted path looks longer.

18. **The follow-up answer never appeared.** In `~/profai/qa-shots/2026-10-29/lim/102.png`, `~/profai/qa-shots/2026-10-29/lim/103.png` and `~/profai/qa-shots/2026-10-29/lim/105.png`, I typed a question and pressed Enter. The spinner showed, then the screen went back to the "LESSON 4 DONE" card with no new text. The page text did contain "You asked: ..." and an answer, but it was not visible. "Back to the lesson" could not be tapped (`~/profai/qa-shots/2026-10-29/lim/106.png`: the tap timed out). She asked her question and got nothing. This is a P0 bug. Fix: show the answer in a clear panel above the keyboard. Make "Back to the lesson" tappable. Close the "lesson done" card when a question is sent.

19. **The answer, if she could read it, is thin.** Its text: "the Sun sends a little purple, lots of blue; our eyes love blue best". For an 8-year-old this skips the key idea (the air bounces blue around more). "Sunlight has little violet" also sits awkwardly with the lesson 3 quiz, where "violet is not in sunlight" was marked wrong. Fix: make the follow-up answer use the lesson's own picture ("tiny air bits bounce the short blue waves like small balls off pebbles") and explain "pale violet to our eyes".

20. **Where is the sky?** Lessons 1 to 3 never show the sky or a person looking up (`~/profai/qa-shots/2026-10-29/lim/007.png`, `~/profai/qa-shots/2026-10-29/lim/028.png`, `~/profai/qa-shots/2026-10-29/lim/052.png`). Lesson 4 shows a teal rectangle. She expected to see "blue light bounced from all over the sky into your eyes". That idea is never drawn.

## 3. Hard to read, too small, too faint, moving, cluttered, childish

- **Faded rainbow bar** (`~/profai/qa-shots/2026-10-29/lim/007.png`): the colours are washed with a white fade, so orange and red look like pink-brown. She would struggle to tell "red" from "orange". Fix: full-strength colours.
- **Grey and light text**: "Your level" (`~/profai/qa-shots/2026-10-29/lim/001.png`), "Lesson 1 of 4" and the sub-labels under each level ("New to it", "Know a little") are thin grey on cream. Fix: darker grey, about 4.5:1 contrast at least, and 16 px or larger for sub-labels.
- **Faded graph curves**: in `~/profai/qa-shots/2026-10-29/lim/060.png` the curves, "scattered by air" and "eye sensitivity" are pale and low-contrast. Fix: stronger colours and direct labels at the line ends, kept clear of overlaps.
- **Labels on top of lines**: "white light" has a line through it in `~/profai/qa-shots/2026-10-29/lim/038.png`. "sunlight" overlaps the dashed curve in `~/profai/qa-shots/2026-10-29/lim/060.png`. In `~/profai/qa-shots/2026-10-29/lim/039.png` a blue arrow crosses the "scattering strength: 71%" text.
- **Small axis labels**: "0.1 … 1", "400 … 650", "wavelength (nm) →" on `~/profai/qa-shots/2026-10-29/lim/052.png` are small for glasses at arm's length. The y-axis "amount" is unexplained.
- **Cluttered "your eye" label**: in `~/profai/qa-shots/2026-10-29/lim/085.png` and `~/profai/qa-shots/2026-10-29/lim/092.png`, "your eye" and "Sun" are drawn on top of the box border.
- **Big dead space**: `~/profai/qa-shots/2026-10-29/lim/007.png` and `~/profai/qa-shots/2026-10-29/lim/013.png` show a tall blank area between the banner and the bar. The key thing is small, in the middle of a lot of nothing.
- **Hint box vs actual action**: the pill at the bottom ("Drag the marker to the red end.") jumps between one and two lines and moves the layout.
- **Not childish.** The design is calm and serif-led, and she liked that. The black and white buttons look professional.
- **Good readability**: the serif banner text is large and clear, "Continue" is a big black button, and the green tick and "Exactly." feedback is easy to read. The "LESSON n DONE" cards (`~/profai/qa-shots/2026-10-29/lim/026.png`) were clear and she would use them to revise.

## 4. Did she actually learn it?

**What she would tell her grandson:** "Sunlight looks white but it is every colour mixed, like a rainbow. The air is full of tiny, tiny bits. Blue light has short waves and the tiny bits bounce it around much more than red, so blue gets bounced all over the sky and into our eyes. Violet bounces even more, but our eyes aren't good at seeing violet, so the sky looks blue. At sunset the sunlight goes through much more air, so the blue gets bounced away on the way and only the red and orange are left."

She reached this partly from the "Done" cards and partly from what she already knew. The first lesson taught her almost nothing and cost her trust.

**As a science teacher, was it correct, complete and well taught?**

Correct:
- White light is made of all colours. Shorter wavelengths scatter much more. Blue is more visible than violet because of eye sensitivity and the mix of sunlight. Sunsets are red because the long path removes blue. All are broadly right.
- "Halve the wavelength and scattering jumps 16 times" is right (`~/profai/qa-shots/2026-10-29/lim/047.png`).

Wrong or sloppy:
1. **The wavelength readout runs backwards** in lesson 1 (see 2.3).
2. **"The rule is the fourth power of wavelength"** (`~/profai/qa-shots/2026-10-29/lim/047.png`) is incomplete. It is the inverse fourth power (1/λ⁴). As written it says longer waves scatter more.
3. **"5 to 6 times" blue over red** disagrees with the display (23% against 100%, about 4 times) and with 450 against 650 nm.
4. **"Scattered rays spray out strongly in every direction. That is blue light."** (`~/profai/qa-shots/2026-10-29/lim/039.png`) mixes up a direction idea with colour. The pattern of directions is the same for every wavelength. It is the amount that differs.
5. **"Eye sees: 37% … our eyes see it strongly"** is self-contradictory.
6. **"Sunlight has little violet"** in the follow-up is partly true, but the lesson never says so. The quiz option "violet is not in sunlight" is marked wrong without explanation.

Missing (this makes the teaching incomplete):
- No picture of why we see blue **from all directions** (scattered light reaching the eye from everywhere, not from the Sun).
- Nothing on why the Sun itself looks white or yellow, or why space and the Moon sky are black.
- Nothing connecting the pale horizon to the sky picture. The "paler horizon" claim (`~/profai/qa-shots/2026-10-29/lim/093.png`: "light bounces many times through more air, mixing in white") is a bare statement with no picture.
- No simple analogy for an 8-year-old (small ball against pebbles, or small waves against a post).

Teaching method: the predict-then-reveal quizzes and the "Show me" fallback are good teaching moves. The sources (Met Office, NASA Space Place, Hong Kong Observatory) and the "ProfAI writes each lesson with AI. It can get things wrong" note (`~/profai/qa-shots/2026-10-29/lim/109.png`) are good. But the live demonstrations are the weakest part, because three out of four disagree with their own labels.

## 5. Anything wrong, broken or untrustworthy

- Readout reversed in lesson 1 (see 2.3 and 2.4).
- Hit-test failures on molecules and on the beam (see 2.8 and 2.9).
- The follow-up answer is invisible and "Back to the lesson" can't be tapped (see 2.18). It looks like the page's overlay covers the answer.
- Lesson 4 readouts are blank and the sky never changes colour.
- Numbers disagree between sentence and display (450 against 490, 470 against 670, 5 to 6 times against 4 times).
- Percentages over 100% (132%, 152%) with no explanation.
- The percentage labels under 100% for a sentence that says "strongly".
- The "Show me" action leaves a state that contradicts the confirmation.
- The progress bar in the lessons has 6 segments while the title says "Lesson 1 of 4". It is not wrong, but she can't tell what the 6 mean. A visible "step 2 of 5" would help.
- Good: it never invented a source. The "Sources" list is real-looking and the AI disclaimer is honest.

## 6. Would she use it again or show her grandson? Score: 5/10

The look is calm, the pace is gentle and the lessons are in a sensible order (rainbow, bouncing, blue not violet, sunsets). I would like to use it. But three of the four demonstrations contradict themselves, so I can't hand the phone to an 8-year-old and let him believe what it shows. He would drag the marker to red and read "407 nm". I would be sitting beside him explaining the website's mistakes. If the numbers were right and the follow-up worked, this would be an 8.

## 7. The 5 changes that matter most, in her words

1. "Make the numbers match the colours. When I touch red it must say 700, and when I touch violet it must say 400."
2. "When I ask a question, show me the answer. And let me press 'Back to the lesson'."
3. "Make the tapping easy. If I touch an atom or the sunbeam, it should count."
4. "Show me a real sky. Let the picture go blue at noon and red at sunset, and show the numbers beside 'path through air'."
5. "Don't make things move by themselves, and don't make the page jump. And explain 'nm' and 'wavelength' in one plain sentence first."

## Exact improvement list

Ranked by impact.

1. **Fix the lesson 1 wavelength readout direction.** Where: the rainbow bar in lesson 1 (`~/profai/qa-shots/2026-10-29/lim/007.png`, `~/profai/qa-shots/2026-10-29/lim/008.png`, `~/profai/qa-shots/2026-10-29/lim/014.png`, `~/profai/qa-shots/2026-10-29/lim/018.png`). Change: make the readout follow the label (left red = 700, right violet = 400); then check that "Show me" for red, violet and blue lands on 650, 420 and 470. Why: it contradicts its own labels, so a teacher loses trust at step 1.
2. **Make the follow-up answer visible and the page recoverable.** Where: the "Ask anything about this" panel and the "LESSON n DONE" card (`~/profai/qa-shots/2026-10-29/lim/102.png`, `~/profai/qa-shots/2026-10-29/lim/103.png`, `~/profai/qa-shots/2026-10-29/lim/105.png`, `~/profai/qa-shots/2026-10-29/lim/106.png`). Change: show the question and answer in a visible panel above the input; dismiss the "done" card when a question is sent; make "Back to the lesson" tappable. Why: she asked a real question and got nothing.
3. **Enlarge tap targets.** Where: molecules in lesson 2 (`~/profai/qa-shots/2026-10-29/lim/030.png`), the beam in lesson 4 (`~/profai/qa-shots/2026-10-29/lim/080.png`), and the graph dot in lesson 3 (`~/profai/qa-shots/2026-10-29/lim/066.png`). Change: at least 44 px hit area; let a tap on the graph move the dot; tell her what was missed ("You tapped the empty air. The atoms are the grey circles.").
4. **Make "Show me" consistent.** Where: lessons 1 to 3. Change: it should move the marker onto the target and then show the confirming sentence. Never leave a state that contradicts the banner (`~/profai/qa-shots/2026-10-29/lim/011.png`).
5. **Draw a real sunset.** Where: lesson 4 (`~/profai/qa-shots/2026-10-29/lim/085.png`, `~/profai/qa-shots/2026-10-29/lim/091.png`, `~/profai/qa-shots/2026-10-29/lim/092.png`). Change: change the sky colour with the Sun height and dust sliders; draw the eye at the bottom and the Sun overhead at noon; show a thick air layer so the long path is visible.
6. **Fill in the blank readouts** next to "path through air", "blue scattered away" and "red reaching you". Use a number or a small bar for each.
7. **Correct the science text.** Where: lesson 2 and lesson 3. Change: "inverse fourth power" or "scattering goes up as wavelength goes down: 1 over wavelength to the fourth" (`~/profai/qa-shots/2026-10-29/lim/047.png`); "about 4 times" for 450 against 650 nm (`~/profai/qa-shots/2026-10-29/lim/045.png`); remove "spray out in every direction. That is blue light" (`~/profai/qa-shots/2026-10-29/lim/039.png`); change "our eyes see it strongly" or the 37% figure (`~/profai/qa-shots/2026-10-29/lim/071.png`).
8. **Add the missing key picture.** Where: before lesson 2 or inside lesson 3. Change: show a person looking at the sky with arrows of scattered blue coming from every direction into the eye, and a line on why the Sun itself looks white and the night sky is black.
9. **Stop controls moving by themselves.** Where: `~/profai/qa-shots/2026-10-29/lim/022.png`, `~/profai/qa-shots/2026-10-29/lim/043.png`, `~/profai/qa-shots/2026-10-29/lim/092.png`. Change: if the page must reset a control, say so on screen ("I've set it to 450 nm for you").
10. **Remove layout jumps.** Where: lessons 2 and 4 (`~/profai/qa-shots/2026-10-29/lim/028.png` to `~/profai/qa-shots/2026-10-29/lim/030.png`, `~/profai/qa-shots/2026-10-29/lim/091.png`, `~/profai/qa-shots/2026-10-29/lim/092.png`). Change: fix the height of the banner and hint area so the diagram stays put.
11. **Simplify lesson 3's graph.** Where: `~/profai/qa-shots/2026-10-29/lim/052.png`, `~/profai/qa-shots/2026-10-29/lim/060.png`. Change: one curve first (scattering), then add eye sensitivity on a later step; move labels off the lines; explain or cap percentages over 100% (`~/profai/qa-shots/2026-10-29/lim/067.png`).
12. **Make the arrows and the instructions agree.** Where: `~/profai/qa-shots/2026-10-29/lim/007.png`, `~/profai/qa-shots/2026-10-29/lim/013.png`. Change: point the hint arrow toward the target end.
13. **Explain jargon at first use.** Where: `~/profai/qa-shots/2026-10-29/lim/007.png`. Change: one plain line for "wavelength" and "nm" before the bar, and change "Blue light sits in between" (`~/profai/qa-shots/2026-10-29/lim/017.png`).
14. **Level picker.** Where: `~/profai/qa-shots/2026-10-29/lim/001.png`. Change: state that Beginner is pre-selected, or start with none selected. Add one line telling her she can change level later.
15. **Contrast and size.** Where: grey sub-labels, "Your level", the faded bar and curves (`~/profai/qa-shots/2026-10-29/lim/001.png`, `~/profai/qa-shots/2026-10-29/lim/007.png`, `~/profai/qa-shots/2026-10-29/lim/060.png`). Change: darker text (about 4.5:1 or better), 16 px minimum, full-strength rainbow colours, bigger axis numbers.
16. **Improve the follow-up answer style.** Where: the AI answer to a child-level request. Change: give a short story with an analogy (small balls bouncing off pebbles), consistent with the lesson, and tell her which lesson it relates to.
17. **Clarify the progress bar.** Where: the top bar on every lesson. Change: label it "Step 2 of 5", or use one segment per step with a clear count.
18. **Fix "your eye" and "Sun" labels** overlapping the box border (`~/profai/qa-shots/2026-10-29/lim/085.png`, `~/profai/qa-shots/2026-10-29/lim/092.png`).
19. **Add a "Teach it to a child" ending.** Where: after lesson 4. Change: a short 3-sentence summary she can read aloud, plus an optional demo she can show on the phone. This is what she actually came for.
20. **Keep and extend what works:** the "Building your course" progress steps (`~/profai/qa-shots/2026-10-29/lim/006.png`), the predict-then-reveal quizzes, the "Done" summary cards (`~/profai/qa-shots/2026-10-29/lim/026.png`), the Sources list and the AI-error disclaimer (`~/profai/qa-shots/2026-10-29/lim/109.png`).

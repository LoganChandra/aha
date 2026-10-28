# Blind persona QA: Kumar, 44, logistics supervisor (how ChatGPT works)

Panel run 2026-10-29 on https://profai-poc.vercel.app. Reviewer: fresh Sonnet subagent, blind to code. Screenshots: ~/profai/qa-shots/2026-10-29/<persona>/ (kept out of git).

I stopped partway through lesson 4 of 5, after about 90 actions. By then Kumar had seen what the site does and was tired of fighting it, so I never reached lesson 5.

Screenshot folder: `~/profai/qa-shots/2026-10-29/kumar/`. Files are named by number, for example `009.png`, and I give the full path only for the first one.

My taps were synthetic. In four places (kitten, the "blorf" sentence, the "Tap any dial" step, and the lesson 4 confidence bar) a tap did not register as I intended. Some of that may be my tap accuracy. But the on-screen feedback was wrong or contradictory either way, and Kumar would have seen the same thing.

---

## 1. Kumar's story (first person)

I sat down in the canteen with my nasi lemak and opened the site my son's school friend's father mentioned. White page, big words: "What do you want to understand?" Fine. I saw five levels. "Beginner, know a little" was already picked. I've never used ChatGPT, so I tapped "Novice, New to it". Good that they say it in plain words.

I typed "how does chatgpt actually work". It said "Building your course", then showed a sketch squiggle and "Drawing lesson 1" for maybe 20 seconds. I nearly went back to my food. Then a picture appeared: dots for words. "Tap the word closest to 'cat'." There is no cat on the screen. I tapped "kitten", obviously a baby cat. It said "Not that one." I tried again, same. I felt stupid. I tapped "Show me" and it said dog is the answer. So kitten is wrong and dog is right? I did not like that.

Next it told me to drag "mango" near "the other fruit". There is no other fruit. There are animals and a king and queen. I dragged mango around. It said "like the other fruit", and mango was sitting on top of "prince". I typed my first "but why?" question. The answer was good: words need numbers so the computer can do maths. But it said the fruit is "near the bottom". I looked. No fruit.

Lesson 2 was better. Bars for "The cat sat on the ___". I tapped the tallest. A slider called "Temperature" appeared. I slid it and the bars went flat, then I pulled it down and one bar took over. That, I understood: ChatGPT guesses the next word, and temperature is how adventurous the guess is. I asked "so it just guesses? then how come it's right so often?" and got a straight, honest answer, including "it can still be confidently wrong". I liked that.

Lesson 3 was strange. Round dials, "wrongness: 100%". I could not tell which sentence to tap. Then "Training steps" slider: wrongness went to 1%. I enjoyed that. Then "Tap any dial" said "Not that one." Any dial, but not that one? I gave up and pressed Show me.

Lesson 4 is about making things up. "Two answers from ChatGPT, one is true, one is made up." I could not see either answer, only two blue boxes. I couldn't play the game. But the message at the end, "the model didn't do that check, you did", is something I'll tell my son. I'd give it another try, but only if they fix the tapping and the missing stuff.

---

## 2. Every moment he was confused, stuck or unsure

**C1. The first step demands something he cannot see.**
- Screenshot: `~/profai/qa-shots/2026-10-29/kumar/009.png`
- On screen: the instruction "Tap the word closest to 'cat'." The labels "animals here" and "royals here" are pills sitting on top of the dots. The "kitten" label is cut off ("kitte") by the "royals here" pill. There is no word "cat" anywhere. The cat dot is hidden under the "animals here" pill.
- Why it hurt: he did not know what to tap, and the one word he can see that is obviously a cat is wrong.
- Expected: a visible target word and labelled dots.
- What the product should do instead: show "cat" as a visible highlighted dot (a ring around it) and make the question "Which word is closest to cat?" Move the callout pills so they never cover a dot or a label (see 3.1).

**C2. "Not that one" for kitten, with no reason.**
- Screenshots: `010.png`, `011.png`, `012.png`
- On screen: three wrong-answer messages in a row ("Not that one. Tap the word closest to 'cat'."). The answer turned out to be dog, which the "Show me" screen `013.png` confirms: "Cat and dog sit almost on top of each other."
- Why it hurt: kitten is the more natural answer, so the test punishes common sense and makes him feel stupid. This is exactly the point where he closes the page.
- What the product should do instead: either accept kitten, puppy and dog (all animal dots), or give feedback that explains: "Close, but on this map dog sits nearest. Kitten is also very near." After two wrong tries, auto-offer "Show me" with a highlighted answer.

**C3. "Near the other fruit" when there is no fruit.**
- Screenshots: `014.png`, `015.png`
- On screen: "Drag mango to where a computer would put it: near the other fruit. The running jump slider moves it right." There are no fruits and no sliders. The words "running jump slider", "Your word, across" and "Slide 'Your word, across' to the right" refer to controls that do not exist.
- Why it hurt: he cannot follow the instruction, so he does random things.
- What the product should do instead: put 3 fruit dots (apple, banana, papaya) in the picture, or remove the fruit wording. Delete the slider wording. Say "Drag the red mango dot to where you think it belongs."

**C4. Success message contradicts what he sees.**
- Screenshots: `017.png`, `031.png`
- On screen: "Now mango's number list starts with a positive number, like the other fruit." Mango sits right on top of "prince" and "king".
- Why it hurt: it says he did it right while the picture shows mango among royalty. He distrusts the site. This sentence is also copied into the lesson 1 recap card.
- What the product should do instead: fix the data so the fruit cluster exists, or remove the sentence. Show a check only when mango is inside the fruit cluster.

**C5. Second drag step again about fruit and vegetables.**
- Screenshot: `018.png`, with `019.png` (the drag did not change the value, still "(2,2)")
- On screen: "Drag the up-and-down slider until mango sits among the fruit and vegetables."
- Why it hurt: there are no fruit or vegetables and no slider. The drag did not move mango.
- What the product should do instead: same as C3; make dragging free in both directions.

**C6. The AI's own answer refers to things not on screen.**
- Screenshot: `024.png`
- On screen: "The fruits and vegetables are the cluster near the bottom; mango is still up by king and queen. Drag the up-and-down slider down to about -2." Mango is at (2,-2) near the bottom, and there is nothing else there.
- Why it hurt: the help answer is confident about a cluster that is not drawn.
- What the product should do instead: the tutor answer must be checked against what is actually drawn. Draw the cluster so the answer is true.

**C7. "Two orange arrows" that do not exist.**
- Screenshot: `025.png`
- On screen: "The two orange arrows from cat→dog and king→queen point the same way: animals left, royals right, and both pairs step up for young-to-old." No arrows are drawn. "Step up for young-to-old" is hard to follow.
- Why it hurt: he cannot find what the text describes, and the sentence is about 25 words of abstract geometry.
- What the product should do instead: draw the arrows and name them, or drop the step. Use "Cat to dog is a step up and right. Prince to king is also a step up and right. Same direction means the same kind of change: young to grown-up."

**C8. Confusing numbers like "mango is (-3,-3)".**
- Screenshot: `009.png` (at the top of the chart), `015.png` (shows "(0,0)")
- On screen: the plain coordinates, with no explanation of what two numbers mean.
- Why it hurt: it is the one concept the lesson is about (a word as a list of numbers), but it is presented as a label he is meant to already understand.
- What the product should do instead: put "Each word is just two numbers: how far across, and how far up" next to it, with the dot's position shown by thin guide lines.

**C9. Temperature is introduced without saying what it is.**
- Screenshot: `035.png`, `036.png`
- On screen: a "Temperature" slider that appears right after he taps the tallest bar. The bars flatten when slid right.
- Why it hurt: "temperature" is jargon. He had to figure it out from the bars. (He did, but only because of the quiz that followed.)
- What the product should do instead: label it "How adventurous (temperature)" with "Safe" on the left and "Wild" on the right.

**C10. The loop explanation is not shown.**
- Screenshots: `043.png`, `044.png`
- On screen: "Now the sentence is 'The cat sat on the mat'" but the line on screen still reads "The cat sat on the ___" with the chance label "mat". The final card says the loop is "the whole trick" but nothing visibly loops.
- Why it hurt: the key idea of the whole course is stated in a sentence and never animated.
- What the product should do instead: when he taps "mat", actually write "mat" into the sentence, then show a fresh set of bars for the next word. Do it three times. Then say "That loop is the trick."

**C11. "Tap the sentence that makes no sense" did not respond.**
- Screenshots: `054.png`, `056.png`, `058.png`
- On screen: "The cat sat on the blorf" with a "nonsense" pill pointing to it. Tapping the sentence text three ways did nothing. Tapping the book icon gave "Not that one." (`059.png`).
- Why it hurt: the obvious thing does nothing. He doesn't know whether the page is broken.
- What the product should do instead: make the whole sentence line a big tap target with a visible border, and respond to every tap, even a wrong one.

**C12. "Dials" are never explained.**
- Screenshots: `054.png`, `061.png`, `065.png`
- On screen: five small gauge icons labelled "dials". Slider "Dials tuned" is stuck at 1 and does nothing visible.
- Why it hurt: he does not know what a dial stands for in a computer.
- What the product should do instead: one plain sentence: "A dial is one tiny number inside ChatGPT that decides how much it likes a word. Nobody sets them by hand." Remove "Dials tuned" if it does nothing.

**C13. Contradictory instruction "Not that one. Tap any dial."**
- Screenshot: `074.png` (the step), result text copied in my notes after the tap
- On screen: "Tap any dial." After tapping a dial: "Not that one. Tap any dial." The step is stuck until "Show me".
- Why it hurt: it is plainly a bug, and it kills trust.
- What the product should do instead: any dial tap passes. If the target is small, make the tap target the whole row of dials.

**C14. Wrongness percentage jumps around.**
- Screenshots: `065.png` (1% at 99 steps), `069.png` (10% at "90")
- On screen: the same "99 steps" gives 1%, then the next step says 90 steps and 10%. A red box of changing size. Also at step 4 of lesson 3 the label is "wrongness: 0%".
- Why it hurt: he wonders whether the numbers are made up.
- What the product should do instead: make the number follow the slider smoothly, and explain "wrongness = how surprised the model is by a real sentence".

**C15. Lesson 4: the two answers are never shown.**
- Screenshots: `084.png`, `088.png`, `093.png`
- On screen: "Two answers from ChatGPT. Both sound confident. One is true, one is made up." Only two blue boxes labelled "Answer A", "Answer B", with overlapping orange "Confidence" bars, "Check source" and an unlabelled red cross icon. The actual answer text is not shown anywhere.
- Why it hurt: he is asked "which is more likely to be invented?" with nothing to judge. He guessed "both equally" at random.
- What the product should do instead: show two real short answers in text, for example a question about a Malaysian law or a shipping rule, with one invented. Let him judge, then reveal.

**C16. Quiz answers are not fully tappable by text.**
- Screenshot: `026.png`
- On screen: tapping the word "cat" hit the dot label in the chart first, and the quiz did nothing until I tapped the button itself.
- Why it hurt: a user would just see nothing happen.
- What the product should do instead: make sure quiz buttons have higher priority than chart labels and show a pressed state.

**C17. First screen: the preselected level and a dead tap.**
- Screenshots: `002.png`, `003.png`
- On screen: "Beginner" is already filled black, but he has never used the thing.
- Why it hurt: if he skips this he gets the wrong level silently.
- What the product should do instead: preselect nothing, or ask "Have you used ChatGPT before? Yes / No" instead of five labels.

---

## 3. Hard to read, too technical, ugly, cluttered or boring

3.1. Callout pills cover the picture. `009.png`: "animals here", "royals here" cover dots and the "kitten" label. `054.png`: "nonsense" and "dials" pills sit on top of the diagram. `084.png`: "Answer A/B" pills overlap "Confidence" bars. Fix: place labels outside the shapes, with a small leader line, and never on top of text.

3.2. Overlapping labels. `014.png` and `017.png` have "king" over "queen" and "prince" over the mango dot. `088.png` has "Answer A" over "Confidence". Fix: space the dots out.

3.3. Chart text crowded at the screen edge. `009.png`: "queen" is clipped at the right edge. `014.png`: "queen" again. `024.png`: the long tutor answer reaches the bottom of its card and almost touches the edge.

3.4. Long-wait screens look dead. `008.png`: "Drawing lesson 1" with a squiggle, about 10-20 seconds; each later lesson was the same (`052.png`). Fix: show a progress line ("Drawing 2 of 5...") and let him read the lesson goal while he waits.

3.5. Too many micro-steps. Lesson 1 had about 8 steps (drag, drag, quiz, back, drag, continue). Lesson 3 had the same. For lunch-break reading it feels long, and the progress bar splits each lesson into 6 segments so "5 lessons" is really about 30 steps.

3.6. Jargon: "embedding" (`029` text), "temperature", "dials", "training steps", "GPT-3 has 175 billion dials". Fix: introduce each with a one-line everyday comparison (a forklift/warehouse analogy would suit him: "like a picker who has seen millions of orders and guesses the next item").

3.7. Text size. Headline serif text is readable, but the grey helper text such as "Know a little", "Your level" (`002.png`) and the greyed "mat" and "sofa" labels after a step (`044.png`) are low contrast for a man in a bright canteen.

3.8. The "Show me" button is plain grey text next to a faded "Continue". It is easy to miss and it looks disabled. Yet it is the only way out when stuck.

3.9. The chat icon (round speech bubble) has no label. I only found it because I tapped it. Fix: label it "Ask a question".

---

## 4. Did he actually learn something?

In his words: "ChatGPT turns every word into numbers, so words that mean similar things end up close together. It then plays a guessing game: it looks at the sentence so far and guesses the next word, one word at a time, and each new word goes back in as part of the question. A setting called temperature makes it play safe or play wild. It learned by reading a huge pile of real text and being nudged when it guessed wrong, so nobody wrote grammar rules. It can still sound sure and be wrong, so I must check things myself."

Is that correct? Yes, in broad strokes. It is the standard simplified account: embeddings, next-token prediction, temperature, training by error correction, and hallucination. Nothing he took away is false.

Is it complete? No. Missing: the word "token" (words are really chopped into pieces), what "attention" or the "transformer" does (how the model uses earlier words), what happens after pre-training (human feedback, why it behaves like an assistant), why it knows nothing after its training date, and why the same question gets different answers (temperature touches on it only). Lesson 5 was not reached, so I cannot say it covers them. What he learned about "dials" is thin: he does not know what they are. And he did not really learn "embedding" or the 2-number picture, because the dots exercise was broken.

A fair summary: he learned the guessing game and temperature well, the training idea reasonably, "words as numbers" only as a sentence, and the made-up-answers lesson only as a conclusion without a demo.

---

## 5. Anything wrong, broken or untrustworthy

- Success text that contradicts the picture: "like the other fruit" (`017.png`), repeated in the recap (`031.png`).
- References to things that do not exist: fruit, vegetables, "running jump slider", "Your word, across / up" sliders, "two orange arrows".
- Wrong feedback: kitten is "not that one" (`010.png`, `011.png`); "Not that one. Tap any dial." (`074.png`).
- Taps on obvious targets that give nothing (the "blorf" sentence, `054.png` to `058.png`).
- A drag that does not move the object (`018.png` to `019.png`, value still "(2,2)").
- The sentence in lesson 2 claims "the sentence is now ...mat" while the screen still shows the blank (`043.png`).
- The wrongness number jumps between 1% and 10% for nearly the same slider position (`065.png`, `069.png`).
- Lesson 4 asks him to compare answers that are not displayed (`084.png`, `088.png`).
- Positive: the tutor answers in lessons 1 and 2 were direct, plain, and honest ("it can still be confidently wrong"), and the closing line of lesson 4 ("the model didn't do that check, you did") is the most useful sentence on the site.

---

## 6. Would he come back next lunch break?

**5 out of 10.**

Reason: the core ideas (guessing game, temperature, training) are genuinely good and the tutor answers feel like talking to a patient person. But in the first five minutes he was told he was wrong when he was right, asked to use things that were not on the screen, and given a success message that contradicted the picture. He would return once out of curiosity, because the temperature slider was fun, but he would not trust it as a teacher until the exercises work. If the first lesson were clean, I would make it 8.

---

## 7. Top 5 changes in his words

1. "Don't tell me I'm wrong when I'm right, and don't ask me to tap things I can't see." (Fix the cat/kitten step, the missing fruit, the dead taps.)
2. "Never say something on screen that isn't there." (Fruit, arrows, sliders, "sentence now says mat".)
3. "Show me the two answers in lesson 4. Words, not boxes."
4. "Explain the big words in one line, with an example from my warehouse." (temperature, dials, embedding, training.)
5. "Fewer little steps, and tell me while I wait." (Progress during the 10-20 second drawing screens, fewer micro-steps per lesson.)

---

## Exact improvement list (ranked by impact)

1. **Lesson 1, step 1 (screens `009`-`013`): make "cat" visible and accept kitten.**
   - What: draw "cat" as a visible highlighted dot. Accept cat-cluster words (kitten, puppy, dog) as correct, with a note about which is nearest.
   - Where: the "tap the word closest to cat" interaction and its answer rule.
   - Why: it is the first thing he does, and it punishes common sense.

2. **Never place callout pills over dots or labels (screens `009`, `054`, `084`, `088`).**
   - What: position "animals here", "royals here", "nonsense", "dials", "Answer A/B" outside the shapes with leader lines. Add a collision check so labels never overlap text.
   - Why: hidden dots caused the cat/kitten failure and unreadable labels.

3. **Make every success or hint sentence true to what is drawn.**
   - What: remove or fix "near the other fruit", "fruit and vegetables", "like the other fruit", "two orange arrows", "running jump slider", "Your word, across/up". Either draw fruit and arrows or rewrite the text.
   - Where: lesson 1 steps 2 to 5 and the recap card (`031`).
   - Why: contradictions destroy trust.

4. **Add a render-versus-text consistency check before a lesson is shown.**
   - What: automatically check that every noun in the instruction (fruit, arrow, slider) exists in the picture, and that the success check agrees with the drawn state.
   - Why: all of items 3 and 15 slipped through, so this is a class of bug, not one bug.

5. **Fix dead or contradictory taps.**
   - What: make the "blorf" sentence a large bordered tap target; make "Tap any dial" accept any dial; make the lesson 1 mango drag move reliably in both axes; show a visible pressed state on every tap.
   - Where: `054` to `058`, `074`, `018`/`019`.
   - Why: he cannot tell whether the site is broken or he is wrong.

6. **Lesson 4: show the two answers as real text.**
   - What: display two short answers (for example about a Malaysian shipping or labour rule), one invented. Let him judge, then reveal which, and then show the "check source" tick on the real one. Label the red cross and the green tick with text.
   - Where: `084`, `088`, `093`.
   - Why: the exercise is impossible without content, and this is the lesson most useful to his work.

7. **Show the loop in lesson 2.**
   - What: when he taps "mat", insert "mat" into the sentence and show a new set of bars for the next word; repeat three times; then say "that loop is the trick".
   - Where: `041` to `044`.
   - Why: it is the central idea and is currently only a sentence.

8. **Explain jargon in one plain line with a warehouse-style example.**
   - What: temperature ("how adventurous"), dials ("tiny numbers inside it"), embedding, training steps, and the "175 billion" fact (compare to something countable). Label the temperature slider "Safe" to "Wild".
   - Where: `035`, `054`, `061`, `029` text.
   - Why: he does not like jargon and learns from real-life examples.

9. **Explain what the coordinates mean.**
   - What: next to "mango is (-3,-3)", add "two numbers: across and up", with guide lines from the axes to the dot.
   - Where: `009`, `014`.
   - Why: this is the core idea of lesson 1.

10. **Cut the number of micro-steps and add progress while waiting.**
    - What: limit each lesson to 3-4 steps; show "Drawing lesson 2 of 5" plus the lesson goal during the 10-20 second generation screens.
    - Where: `008`, `052`, `084` loading states.
    - Why: he reads in short bursts and gets interrupted.

11. **Make the stuck escape obvious.**
    - What: after one wrong tap, show a clear "Show me" button with a border; after two, offer it automatically. Label the chat icon "Ask a question".
    - Where: bottom bar on every lesson screen.
    - Why: it is the only way out of a stuck step, and it looks disabled today.

12. **Smooth, consistent numbers.**
    - What: tie "wrongness" to the training slider with a single formula; explain "wrongness" in one phrase; remove "Dials tuned" if it does nothing.
    - Where: `061`, `065`, `069`.
    - Why: jumping numbers look made up.

13. **Level picker.**
    - What: do not preselect "Beginner"; ask "Have you used ChatGPT before? Yes / A little / No" or preselect nothing.
    - Where: `002`.
    - Why: it silently set the wrong level for a non-user.

14. **Readability.**
    - What: raise the contrast of grey helper text and faded labels after a step, keep chart labels off the right screen edge, and keep long tutor answers within the card (`024`).
    - Why: bright canteen, one hand, enlarged font.

15. **Keep what works.**
    - Do not change: the plain tutor answers, the honest "can still be confidently wrong" line (`048`), the temperature bars (`036`, `040`), the training slider with wrongness falling (`065`), and the "meaning becomes distance" line (`030`).

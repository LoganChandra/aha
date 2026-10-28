# Blind persona QA: Nurul, 35, staff nurse: how vaccines work (Malay)

Panel run 2026-10-29 on https://profai-poc.vercel.app. Reviewer: fresh Sonnet subagent, blind to code. Screenshots: ~/profai/qa-shots/2026-10-29/nurul/ (kept out of git).

# Blind usability test: ProfAI on a phone, as Nurul Huda binti Ismail (staff nurse, Kota Bharu)

I did about 60 actions across four lessons, one follow-up question and the lesson outline. All screenshots are in `~/profai/qa-shots/2026-10-29/nurul/`, numbered `001.png` to `137.png`. I use the full path for each one below.

Two limits on what I can claim:
- I never saw an address bar, share button, or print option, so I can't say whether a lesson has a shareable link.
- I did not time the loading precisely. I waited 8 to 15 seconds at each step.

---

## 1. Her story (first person)

I opened the site on my Oppo in the waiting area. It said "What do you want to understand?" and "Your level", all in English, and Beginner was already selected. I picked Novice, because the person I want to show this to is a mother who is scared, not a nurse. I typed "bagaimana vaksin berfungsi" and pressed Enter.

I watched "Building your course" for about half a minute. When the first lesson appeared, the lesson text was in proper Malay. I did not expect that, and I liked it.

The first lesson is "Badan Anda Ada Pasukan Keselamatan". I tapped a red germ, then a green shield, then answered "Kejar dan tangkap". It was calm and easy to read, but the word "vaksin" never appeared in the whole of lesson 1. A mother in the waiting room would already be bored.

The shield task annoyed me. Four identical green shields were on screen, I tapped one, and it said "Not that one." in English. Only the second shield counted.

Lesson 2 is about receptors and shapes. I could not find the tiny notch to tap, so I pressed "Show me". Dragging "kuman C" gave me no visible response at all. I did not know whether I had done it right.

Lesson 3 is the one I came for, and it has the vaccine. It says "Vaksin ialah kuman yang sudah dilemahkan". As a nurse I stopped there, because that is not true of every vaccine. Then the diagram showed "pertahanan: 100%" and said "Anda tidak sakit". I would never say those words to a parent. The first one is wrong for several vaccines, and the second is a promise I cannot make.

In lesson 4 I moved the days slider on the graph. The red and green lines nearly meet by day 10. A cynical parent would say, "See, in the end it's the same." The graph never shows that the unvaccinated person is sick during those days.

I asked, as a mother would, "Adakah vaksin selamat? Anak saya demam lepas disuntik, ibu bapa takut ia mengandungi bahan berbahaya." The page text contained a sensible Malay answer. On my screen I could not see it. I only saw the "Lesson 4 done" card.

At the bottom of the lesson list, the "Sources" were a GitHub page, "teach - Claude Skill | MCP Hub" (in German and in Russian), and a Nielsen Norman Group page about jargon. There was no WHO, KKM or CDC source. I would not put this in front of a parent. It is pretty and clever, but I can't trust it with vaccines.

---

## 2. Every moment she was confused, stuck, or unsure

**2.1 Landing screen is English, with a pre-selected level**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/001.png`
- On screen: "What do you want to understand?", "Your level", Novice (New to it), Beginner (Know a little), Intermediate (Studied it), Expert (Use it often), Professional (Work in it), and the field "Type any topic". Beginner is already highlighted.
- Why it bothered her: She has not told the site her language yet, but the site already assumes English. It does not explain what "level" changes. A nurse is a "Professional" on medicine, but the learner here is the parent. She guessed.
- What the product should do:
  - Detect the phone language (Malaysian phones usually report `ms-MY`) or show a small "Bahasa Melayu | English" switch at the top.
  - Replace "Your level" with a plain question: "Anda belajar untuk siapa?" with "Untuk saya / Untuk menerangkan kepada orang lain".
  - Do not pre-select a level without saying so.

**2.2 Long wait with no time estimate**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/005.png` and `006.png`
- On screen: "Building your course", then three steps: "Reading up on it", "Choosing what to learn first", "Designing hands-on lessons". Then "Drawing lesson 1" (the text output of `007.png`).
- Why it bothered her: She is in a waiting area on slow clinic data. She has no idea whether this takes 20 seconds or 5 minutes. The step labels are in English.
- What the product should do: Show an honest estimate ("Biasanya kira-kira 30 saat"). Show the loading steps in the course language. Offer a one-line summary ("Anda akan belajar 4 perkara") while the first lesson loads.

**2.3 Lesson 1: the "tap the green shield" task**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/012.png`, `014.png`, `016.png`
- On screen: The instruction says "Tekan pengawal hijau." and "Tekan perisai hijau di kanan." Four identical green shields are stacked on the right. I tapped the first and then the top one. Both gave "Not that one. Tekan perisai hijau di kanan." Only the second shield, the one with the "pengawal" label attached, was accepted (`017.png`).
- Why it bothered her:
  - "The green shield on the right" matches four shields, but only one is correct. This is an unwinnable guess.
  - The shapes also pulse and drift. In `012.png` the shield sits at y=693. In `014.png`, a moment later, it sits at y=668. A tap that lands on the old position misses.
  - The error message begins with English "Not that one." and repeats the same instruction without helping.
- What the product should do:
  - Accept any of the four shields. They are the same object.
  - If only one must be chosen, show one shield only.
  - Stop the pulse animation and the drift while a tap is expected.
  - Give hit areas of at least 48x48 dp.
  - Use a warm Malay hint: "Hampir! Cuba perisai hijau yang berlabel 'pengawal'."

**2.4 Lesson 1: the label sits on top of the thing it describes**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/008.png`, `009.png`, `012.png`, `022.png`
- On screen: In `008.png` the "kuman" label covers a bug, and "badan anda" sits on the circle. In `012.png` the "pengawal" pill sits on top of the person icon and "badan anda" overlaps the ring. In `022.png` "kuman" and "pengawal: 3" collide at the top.
- Why it bothered her: The labels are what a parent reads, and here they hide the picture.
- What the product should do: Place labels outside the objects with a leader line, or use fewer, larger labels. Do not draw two text items in the same place.

**2.5 Lesson 1: "pengawal" drops from 4 to 3 with no reason**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/022.png`
- On screen: After "Kejar dan tangkap", the counter changes from "pengawal: 4" to "pengawal: 3" and "kuman: 3" stays.
- Why it bothered her: It looks like a guard was lost. No sentence explains it.
- What the product should do: Remove the change or explain it, for example "Seorang pengawal sedang mengejar kuman."

**2.6 Lesson 1: the word "vaksin" does not appear**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/030.png` and the lesson 2 summary
- On screen: Two full lessons (about 16 screens) are about "kuman", "pengawal" and "reseptor". The course title is "Bagaimana Vaksin Berfungsi".
- Why it bothered her: She asked about vaccines. A hesitant mother has already stopped paying attention by lesson 3.
- What the product should do: Mention the vaccine in the first screen ("Vaksin mengajar pengawal ini sebelum kuman sebenar datang"). Better, compress lessons 1 and 2 into one.

**2.7 Lesson 2: the "tap the notch" task has no feedback**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/032.png`, `033.png`, `034.png`
- On screen: The instruction is "Ketik lekuk pada sel pertahanan." The notch is a tiny orange shape behind the text "sel pertahanan" and the "lekuk" pill. The message "Belum padan. Seret lagi." is already showing before any attempt. I tapped near it and nothing visibly changed.
- Why it bothered her: She cannot find the target. The message "Belum padan. Seret lagi." says "not a match yet, drag again" before she has dragged anything, and the instruction says tap, not drag. Silence after a miss makes her think the phone froze.
- What the product should do:
  - Make the target at least 48 dp and put a pulsing ring on it.
  - Hide "Belum padan" until a drag has happened.
  - After a miss, show "Belum kena. Cuba ketik bahagian oren."

**2.8 Lesson 2: the "Show me" button solves the task without teaching it**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/035.png`, `036.png`
- On screen: I pressed "Show me" and the screen answered "Lekuk itu dipanggil reseptor. Ia seperti lubang kunci." and enabled Continue. I never tapped the notch.
- Why it bothered her: "Show me" is English, and it skips the exercise instead of demonstrating it. The lesson summary later says I learned it.
- What the product should do: Rename it "Tunjukkan". Animate where to tap, then let her try.

**2.9 Lesson 2: stacked, wrong labels during the kuman B and C steps**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/042.png` and `046.png`
- On screen: In `042.png`, "kuman A" and "kuman B" are stacked under one bug. In `046.png`, "kuman A" and "kuman C" are stacked under one bug. The germ that was matched earlier is gone, but its label stays.
- Why it bothered her: Which germ is which?
- What the product should do: Remove the label when the item is not on screen. Show A, B and C together permanently.

**2.10 Lesson 2: all three germs look identical, yet the quiz asks her to predict**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/042.png`
- On screen: Three identical red bug icons. The question: "Sekarang cuba kuman B. Adakah ia juga padan? Kuman B akan… melekat / tidak melekat."
- Why it bothered her: The lesson says matching depends on shape, but the shapes are not visibly different. She is asked to guess. She picked "tidak melekat" and was told "Exactly", but the reason was luck.
- What the product should do: Draw A, B and C with clearly different outlines (triangle, circle, star) and a notch with a matching outline.

**2.11 Lesson 2: dragging kuman C does nothing visible**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/048.png` and `050.png`
- On screen: The instruction is "Kuman C pula. Cuba seret ke lekuk." I dragged twice and the bug stayed where it was. "Belum padan. Seret lagi." stayed. After "Show me" the screen said "Kuman C juga tidak padan. Hanya kuman A yang padan." (`051.png`).
- Why it bothered her: She could not tell whether she failed or the app broke. The instruction told her to drag it into the notch, but the right result is that it does not stick, and nobody told her that.
- What the product should do: Let the bug move to the notch, then bounce back with a short message: "Tak padan. Bentuknya berbeza, jadi tak melekat."

**2.12 Lesson 3: the slider "Apa yang masuk?" shows only 0 or 1**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/060.png` and `062.png`
- On screen: "Apa yang masuk?" with the value "0". I dragged it and it became "1" and the picture changed to a syringe labelled "vaksin (kuman lemah)".
- Why it bothered her: "0" and "1" mean nothing to a mother. She must discover by accident that 0 means "kuman sebenar" and 1 means "vaksin".
- What the product should do: Use a two-option switch with words: "Kuman sebenar | Vaksin".

**2.13 Lesson 3: the feedback text is stale**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/062.png` and `064.png`
- On screen: The green banner still says "That's it. Kuman sebenar boleh buat anda sakit kerana badan anda belum kenal dia." while the picture now shows the vaccine, a brain labelled "ingatan", and "pertahanan: 100%".
- Why it bothered her: The words describe a different picture from the one on screen.
- What the product should do: Update or clear the banner when the control changes.

**2.14 Lesson 3: the quiz contradicts the picture**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/066.png`
- On screen: "Sebelum buat apa-apa: apa jadi kalau kuman sebenar masuk sekarang?" Options: "terus kebal / keliru dan sakit / tak rasa apa-apa". The diagram behind it still shows a vaccine, "ingatan" and "pertahanan: 100%". It is also covered by overlapping labels: "vaksin (kuman lemah)", "selamat" and "pengawal bersedia" run together.
- Why it bothered her: The question says "before doing anything", but the diagram says the body is already trained. The correct answer is hard to find when the picture says the opposite.
- What the product should do: Reset the diagram to "pertahanan: 0%" before this question. Separate the labels so they can be read.

**2.15 Lesson 3: decimals on the practice slider**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/071.png`
- On screen: "Latihan pertahanan 0.4", then "pertahanan: 40%".
- Why it bothered her: "0.4 latihan" means nothing. It is not clear what a unit of "latihan" is.
- What the product should do: Show three steps with words ("Tiada / Sedikit / Cukup") or remove the number.

**2.16 Lesson 4: the instruction says to drag the dashed line, but the line is not draggable**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/094.png`, `096.png`
- On screen: The instruction reads "Seret penanda masa ke hari ke-7" and the control hint reads "Seret garis putus-putus ke kanan." I dragged the dashed line on the chart (x=105, y=330 to 190) and nothing happened. The working control is the slider "Hari selepas jangkitan" in a card below the chart. It only worked when I used that.
- Why it bothered her: The words tell her to do something that does not work.
- What the product should do: Make the line draggable with a visible handle, or rewrite the instruction to say "Geser peluncur di bawah".

**2.17 Lesson 4: the first chart screen looks mislabelled**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/084.png` and `086.png`
- On screen: The pill "tanpa vaksin" sits on the green line and "dengan vaksin" on the red area. This is the reverse of what the task says (green = vaccinated). Later screens (`090.png`) have the labels on the correct lines.
- Why it bothered her: At first glance the legend is backwards. A parent could read the green line as "no vaccine".
- What the product should do: Attach each pill to its own line, with a leader. Never position the labels by where there happens to be empty space.

**2.18 Lesson 4: the "hari X: merah" readout**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/090.png`, `098.png`, and `089.png` ("hari 3.11: merah")
- On screen: A black label at the top of the chart reads "hari 3: merah", "hari 7: merah", "hari 13.9: merah".
- Why it bothered her: She has no idea what it means. "Merah" here looks like a status. It also shows decimals such as 3.11 and 13.9.
- What the product should do: Delete it, or write "Hari ke-7" only, and round to whole days.

**2.19 Lesson 4: the feedback contradicts the graph**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/098.png`
- On screen: At day 7, the banner says "Pada hari ke-7, hijau sudah menang. Merah baru mula naik." But the red line is already at about 5 out of a maximum of about 5.5. It started rising at day 3 and is almost at its peak.
- Why it bothered her: The sentence says "just starting to rise" and the picture says "almost at the top". A careful reader notices.
- What the product should do: Write what the picture shows: "Pada hari ke-7, hijau sudah tinggi. Merah masih naik."

**2.20 Lesson 4: the memory slider is tiny and fiddly**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/108.png`, `111.png`, `112.png`
- On screen: The "Latihan ingatan" slider track is about 70 px wide beside the label. Dragging it selected the label text (blue highlight in `108.png`) and moved it to 0.1 and 0.25 only. After "Show me" it read 0.9.
- Why it bothered her: It is small and awkward with a thumb. The chart does not obviously change when she moves it, so she cannot see what she is doing.
- What the product should do: Give the slider a full-width track and disable text selection. Make the chart visibly change with the slider.

**2.21 The question box: the answer is not visible**
- Screenshots: `~/profai/qa-shots/2026-10-29/nurul/123.png`, `125.png`, `127.png`, `137.png`
- On screen: I typed my question in "Ask anything about this" (`120.png`) and pressed Enter. The screen only shows the "LESSON 4 DONE" card, the "All lessons" button and the chat bubble icon. The page text included "You asked: ..." followed by a Malay answer, "Back to the lesson" and "All lessons". None of those lines appeared in any screenshot. I tried tapping the card and swiping upward, and nothing changed. I could not make the answer show.
- Why it bothered her: She asked a real question, waited, and saw no answer. She would think it failed.
- What the product should do: Show the question and the answer in a visible panel right where the user is looking, and scroll to it. Test this on the "lesson done" screen in particular.

**2.22 Lesson list: the learning objectives are written as teacher notes**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/131.png`
- On screen: Each lesson has a description beginning "Menerangkan bahawa badan anda mempunyai...", "Menerangkan bahawa setiap kuman mempunyai 'tanda pengenalan'...".
- Why it bothered her: "Menerangkan bahawa..." ("to explain that...") is an objective written for a teacher. Nobody talks like this to a learner.
- What the product should do: Write them from the learner's side: "Anda akan tahu bahawa badan anda sudah ada sel pertahanan."

**2.23 Stuck with nowhere to go after the lessons**
- Screenshot: `~/profai/qa-shots/2026-10-29/nurul/137.png`
- On screen: The last card has only "All lessons". There is no summary of all four lessons, no "Share with a parent" and no "Save".
- Why it bothered her: Her goal was to show something to a mother. The site has no way to share, print, save or replay.
- What the product should do: Add a final summary card with the three or four main points, a "Kongsi" button (WhatsApp link), and a "Mula semula dari awal" button.

---

## 3. Hard to read, ugly, cluttered, slow, or not natural Malay

### Layout and readability

The design itself is calm and I could read the large serif text. The problems are the diagram labels.

| Screen | What is wrong |
|---|---|
| `~/profai/qa-shots/2026-10-29/nurul/008.png` | "kuman" pill sits on a bug, "badan anda" on the ring. |
| `~/profai/qa-shots/2026-10-29/nurul/022.png` | "kuman" and "pengawal: 3" printed over each other at the top. |
| `~/profai/qa-shots/2026-10-29/nurul/024.png` | "kuman: 3" has a garbled shadow of another label behind it. |
| `~/profai/qa-shots/2026-10-29/nurul/040.png` | "sel pertahanan" and "kuman A" are printed across the cell, and the receptor is covered by the bug. |
| `~/profai/qa-shots/2026-10-29/nurul/066.png` | "vaksin (kuman lemah)", "selamat" and "pengawal bersedia" overlap into one line ("vaksin (kuman lemahselamatjawal bersedia"). Unreadable. |
| `~/profai/qa-shots/2026-10-29/nurul/077.png` text / `078.png` | "sakit" and "badan anda" printed on top of each other under the person icon. |

Other points:
- The progress bar at the top has 5 segments in lessons 1 to 3 and 6 in lesson 4 (compare `~/profai/qa-shots/2026-10-29/nurul/088.png` with `064.png`). I do not know what a segment means.
- The "Continue" button is grey with no explanation until a task is done. A grey button with no reason looks broken.
- The chart's y-axis has numbers (2, 4, 6, 8) with no unit. "kekuatan pertahanan" has no scale a parent can understand.
- Loading: the first lesson took roughly half a minute (`005.png` to `007.png`). The next lessons also needed up to 12 s of waiting each. On slow clinic data this would be worse, and there is no estimate shown.

### English left inside the Malay lesson

The lesson body is Malay, but the app's own words are English:

- Feedback openers: "Spot on.", "That's it.", "Exactly.", "Nice.", "Right.", "Yes.", "Not that one." (`~/profai/qa-shots/2026-10-29/nurul/009.png`, `017.png`, `040.png`)
- Buttons and headings: "Show me", "Continue", "Finish lesson", "Next lesson", "All lessons", "LESSON 1 DONE", "Lesson 2 of 4", "Back to the lesson", "You asked:"
- Input hints: "Type any topic", "Ask anything about this", "Your level"
- Level names: "Novice / New to it", "Beginner / Know a little" and so on
- Loading steps: "Building your course", "Reading up on it", "Choosing what to learn first", "Designing hands-on lessons", "Drawing lesson 1"
- The footer sentence "ProfAI writes each lesson with AI. It can get things wrong, so check anything important against the sources." is only in English. In a medical lesson in Malay, this is the most important sentence and it is in the wrong language.

What it should say:

| English now | Natural Malay |
|---|---|
| Spot on. / That's it. / Exactly. | Betul! / Tepat sekali. / Bagus. |
| Not that one. | Bukan yang itu. Cuba lagi. |
| Show me | Tunjukkan |
| Continue | Teruskan |
| Finish lesson | Tamat pelajaran |
| Next lesson | Pelajaran seterusnya |
| All lessons | Semua pelajaran |
| LESSON 1 DONE | PELAJARAN 1 SELESAI |
| Lesson 2 of 4 | Pelajaran 2 daripada 4 |
| Ask anything about this | Tanya apa-apa tentang ini |
| Type any topic | Taip mana-mana topik |
| What do you want to understand? | Apa yang anda mahu fahami? |

### Malay wording that sounds off, machine-made, or inconsistent

1. **"Tekan" versus "Ketik".** Lesson 1 says "Tekan kuman merah" and lesson 2 says "Ketik lekuk". The same action has two words. On a touchscreen, "Sentuh" or "Ketik" is natural; "Tekan" (press) sounds like a physical button. Use "Ketik" everywhere.
2. **"Tarik slaid untuk beri pengawal latihan"** (`~/profai/qa-shots/2026-10-29/nurul/070.png`). "Slaid" is a transliteration of English "slide". Say "Gerakkan peluncur untuk melatih pengawal." Also "beri pengawal latihan" is better as "melatih pengawal".
3. **"Pengawal" for white blood cells.** A "pengawal" is a security guard, and this sits next to "Pasukan Keselamatan" (which in Malaysia reads as the police or army, not a "safety team"). The more common school and clinic image is "askar" or "tentera" ("sel darah putih ialah askar badan"). The text then also uses "sel pertahanan" and "sel darah putih" for the same cell. Choose one name and always add the real term once: "askar badan (sel darah putih)".
4. **"Kenali Muka Penjenayah" and "gambar muka penjenayah"** (`~/profai/qa-shots/2026-10-29/nurul/079.png`). A "wanted poster" image is fine for adults, but "penjenayah" (criminal) for a germ is heavy with children around, and "muka" is blunt. Better: "Kenal Rupa Musuh" and "gambar rupa kuman".
5. **"Ingatan Yang Kekal".** "Kekal" means permanent. Immunity from some vaccines wears off and needs boosters. Better: "Badan Yang Mengingati".
6. **"Badan sudah hafal"** (`~/profai/qa-shots/2026-10-29/nurul/115.png` text). "Hafal" is memorising by heart, like a surah. Better: "badan sudah mengenali kuman itu" or "badan sudah ingat".
7. **"terus kebal"**. "Kebal" evokes invulnerable. The standard word is "imun" or "berimuniti": "terus berimuniti".
8. **Mixed register.** Most of the text is formal ("Sekarang tukar kepada vaksin"), but some options are slangy ("tak rasa apa-apa", "Sebelum buat apa-apa"). Pick one friendly register: polite everyday Malay with "tidak".
9. **"Menerangkan bahawa..."** in the lesson list (see 2.22).
10. **"Latihan pertahanan" and "Latihan ingatan".** "Latihan" means training or exercise. "Latihan pertahanan: 0.4" does not read like a quantity. Use "Tahap latihan: Tiada / Sedikit / Cukup".
11. **"Bilangan kuman" / "Bilangan pengawal"** are fine, but the picture also prints "kuman: 3 / pengawal: 3" on the canvas. Two copies of the same information.
12. **"kuman" for everything.** It is fine for a parent, but a nurse knows vaccines target bacteria and viruses, and "antigen" is never mentioned. At least once: "kuman (bakteria atau virus)".

---

## 4. Did it explain vaccines correctly?

### What she understood, lesson by lesson

1. The body has defence cells (called "pengawal", and once "sel darah putih"). Germs are foreign things that try to get in. The skin is the first barrier, and the guards chase germs without waiting to be told.
2. A defence cell has a notch (a "reseptor") like a keyhole. Only a germ whose shape matches sticks to it. The cell does not attack randomly.
3. If a real germ comes in, an untrained body is slow and you get sick. A vaccine is a weakened germ. The body trains on it without getting sick, then recognises the real one and fights it. "Vaksin bukan ubat yang membunuh kuman. Ia 'gambar muka penjenayah' untuk pengawal anda."
4. On a graph of "defence strength" over 14 days, the vaccinated person's line rises much sooner and higher than the unvaccinated person's line. Memory cells persist, so the second encounter is faster.

### Nurse's verdict

**The overall idea is right, and some lines are good.** "Vaksin bukan ubat yang membunuh kuman" is exactly the correction many parents need. "Sel pertahanan tidak menyerang secara rawak" is a good way to say specificity. The lesson outline (`~/profai/qa-shots/2026-10-29/nurul/131.png`) says "lemah atau mati atau hanya serpihannya", which is the accurate version.

**But the lessons say something less accurate than the outline, and a few lines are wrong or misleading in ways that matter with a hesitant parent.**

1. **"Vaksin ialah kuman yang sudah dilemahkan — tidak berbahaya."** (`~/profai/qa-shots/2026-10-29/nurul/070.png` text) and the label "vaksin (kuman lemah)" on the syringe.
   - Only live attenuated vaccines (for example BCG, MMR) work this way. Others are inactivated (killed), toxoid, subunit or conjugate (pieces of the germ), recombinant (hepatitis B), or mRNA/viral vector (some COVID-19 vaccines). Some contain no germ at all.
   - "Tidak berbahaya" is also too absolute. Live vaccines are not given to some immunosuppressed patients, and every vaccine has side effects.
   - This is an easy target for a parent who has read something on Facebook: "mereka tipu, vaksin tu ada kuman hidup".
   - The outline already says it correctly. The lesson itself should too.
2. **"pertahanan: 100%"** (`~/profai/qa-shots/2026-10-29/nurul/064.png`, `073.png`). Vaccines do not give 100% protection. A parent who hears "100%" and later knows a vaccinated child who got the disease will conclude the nurse lied. This is a direct honesty failure.
3. **"Pengawal kenal muka penjenayah itu dan terus melawan. Anda tidak sakit."** (`~/profai/qa-shots/2026-10-29/nurul/077.png`) and **"jadi kali kedua ia menang sebelum anda sempat rasa sakit"** (lesson 4 closing line). Both are absolutes. Vaccinated people can still get ill, usually more mildly. Say "biasanya tidak sakit, atau jauh lebih ringan."
4. **"Badan anda tidak sakit, tetapi pengawal mula kenal rupa kuman."** (`~/profai/qa-shots/2026-10-29/nurul/073.png`). The lessons never mention that the injected arm may be sore or that a mild fever can follow. The first time a mother's child gets a fever after the jab, the lesson she was shown said "tidak sakit". That undermines the whole thing. The chat answer does cover mild fever, but only if the user asks and can see it.
5. **The lesson 4 graph hides the actual risk.** The chart is "kekuatan pertahanan" (defence strength). By day 10 the red and green lines almost meet, and by day 14 green is only slightly above red (`~/profai/qa-shots/2026-10-29/nurul/098.png`, `107.png`). A hesitant parent can read it as "in the end it's about the same, so why vaccinate?" What the graph does not show is that during the days the red line is low the unvaccinated person is ill, with possible complications. Add a second strip such as "Keadaan: sakit teruk / sihat" or show "kuman dalam badan" going up for red and staying low for green.
6. **"Merah turun kerana badan lambat belajar."** (`~/profai/qa-shots/2026-10-29/nurul/101.png` text). The red line falls because the infection is over and the response fades back, not because the body is "slow to learn". The reason given is wrong.
7. **The unnamed key terms.** "Antibodi" and "antigen" never appear. Mothers hear "antibodi" in the clinic. The lessons talk about "sel pertahanan" with a "lekuk" and the actual pieces (B cells, antibodies, T cells) are skipped. That is acceptable for a simple explanation, but a nurse would add one line: "Pengawal menghasilkan antibodi."
8. **The chat answer** (page text of `~/profai/qa-shots/2026-10-29/nurul/125.png`):
   > "Vaksin selamat dan demam ringan selepas suntikan adalah tanda biasa sistem imun sedang belajar, bukan bahan berbahaya. Ia biasanya hilang dalam 1-2 hari. Tanya doktor jika demam tinggi atau berlarutan."
   - The content is reasonable, and the Malay is natural (apart from "sistem imun sedang belajar").
   - It does not answer the question about "bahan berbahaya" (ingredients). It says "bukan bahan berbahaya" but does not say what is in a vaccine.
   - It says "Vaksin selamat" flatly. Better: "Vaksin yang digunakan di klinik kerajaan telah diuji dan dipantau keselamatannya".
   - "Demam tinggi" is vague. A nurse would want a number or a sign (for example a temperature, or a child who is limp, will not feed or has a seizure).
   - It tells the user to "Tanya doktor". In a clinic, she is the one being asked. A better line is "Rujuk jururawat atau doktor klinik anda."
   - A Kelantan mother's first question is often about halal. That was not part of my question, so I do not count it as an error, but it is a gap for a Malay-language clinic tool.
9. **Terms consistency.** The lesson 3 summary card repeats "kuman sebenar" and "vaksin" but never connects them to the vaccine types used in Malaysia.

**Overall judgment:** The simplified storyline (train, remember, respond faster) is correct and useful. As written, three statements would not pass my check: "vaksin ialah kuman yang dilemahkan" as a general rule, "pertahanan: 100%", and "Anda tidak sakit". The graph can also be read the wrong way by a sceptical parent. I would not use it with a hesitant parent until those are fixed.

---

## 5. Anything wrong, broken, or untrustworthy

1. **The follow-up answer was not visible to the user** (see 2.21). This is the most serious functional fault. I could read the answer in the page text, but no screenshot ever showed it, and swiping did not reveal it. I cannot say whether it works on other screens, because I only asked on the "lesson done" card.
2. **The sources are not medical** (screenshot `~/profai/qa-shots/2026-10-29/nurul/131.png`, page text). They are:
   - "agent-skills/concept-explainer/SKILL.md at main · JayRHa/agent-skills · GitHub"
   - "teach - Claude Skill | MCP Hub | Modellkontextprotokoll-Hub" (twice, one in German)
   - "Technical Jargon - NN/G"
   - "teach - Claude Skill | MCP Hub | MCP Hub - Сервер протокола контекста модели" (Russian)

   The site tells the user to "check anything important against the sources". For a vaccine course the sources are software prompts and a usability article. A nurse concludes the content was not built from medical sources, so she cannot cite it to a parent.
3. **The "100%" claim and the "Anda tidak sakit" claim** (section 4) are the kind of promise that damages trust when a vaccinated child gets ill.
4. **Contradictions inside the course:** the outline says vaccines contain "lemah atau mati atau hanya serpihannya" but lesson 3 says "kuman yang sudah dilemahkan". Lesson 4's "Merah baru mula naik" contradicts the chart.
5. **A task cannot be completed by a reasonable tap** (the four shields, 2.3) and one instruction says to drag a line that cannot be dragged (2.16).
6. **Disclaimer in English only.** "ProfAI writes each lesson with AI. It can get things wrong..." is honest, but it is in English and sits at the bottom of the list, where a parent will not see it.
7. **I could not verify:** whether the page works offline or on a poor connection, whether the URL is stable, and how the app behaves on a real Oppo (this was a 360x800 emulated screen).

---

## 6. Would she show it to a parent in the clinic?

**4 out of 10.**

Why not higher:
- The lesson on how a vaccine trains the body (lesson 3) is the part a parent cares about, and it is the part with the wrong or over-promised statements.
- It takes about 8 minutes of tapping to reach the vaccine content, and a worried mother in a waiting area will not wait.
- She cannot be sure the sources are credible. Showing a parent a page whose sources are GitHub and a German MCP directory would embarrass her if the parent asked "dari mana maklumat ini?"
- The follow-up question, which is the most natural thing a parent will do, showed no visible answer.

Why not lower:
- The Malay in the lesson body is mostly natural and the tone is friendly.
- The layout is calm and legible, the touch tasks are a good idea, and the "latihan tanpa bahaya" analogy is a good way to explain a vaccine.
- Lesson 3 and the memory graph, once corrected, would be a good 90-second demonstration.

---

## 7. The 5 changes that matter most to her (most important first)

1. **Fix the medical claims.** Remove "pertahanan: 100%" and "Anda tidak sakit". Say vaccines are of several kinds. Mention mild side effects. Add the risk of illness to the graph. (Items 1 to 5 in the improvement list.)
2. **Make the question and answer visible, and give it real sources.** Cite KKM, WHO or CDC with links. Keep the AI disclaimer, in Malay, and show it where people will see it. (Items 6 to 8.)
3. **Say "vaksin" in the first screen and shorten the path.** Merge lessons 1 and 2 or make lesson 3 reachable in about two minutes. (Items 9 and 10.)
4. **Malay interface and natural Malay.** Translate every button and every feedback phrase, and fix the weak wording ("pengawal", "Muka Penjenayah", "kekal", "hafal", "slaid"). (Items 11 to 15.)
5. **Make the touch tasks forgiving and the diagrams readable.** Fix the shields, the tiny notch, the unclear drags, the overlapping labels and the unlabelled sliders. (Items 16 to 25.)

---

## Exact improvement list

Numbered, in the order of importance. Each gives what to change, where, and why.

**Medical accuracy and honesty**

1. **Remove the "100%" readout in lesson 3.** Where: the "pertahanan: 100%" label on the lesson 3 canvas (`~/profai/qa-shots/2026-10-29/nurul/064.png`, `073.png`). Replace with a word scale ("Tiada / Sedang / Kuat") or "Pertahanan: jauh lebih kuat". Why: no vaccine gives 100%, and a parent will remember the number.
2. **Rewrite the definition of a vaccine.** Where: lesson 3, banner "Sekarang tukar kepada vaksin. Vaksin ialah kuman yang sudah dilemahkan — tidak berbahaya." (`070.png` text), and the syringe label "vaksin (kuman lemah)". New wording: "Vaksin mengandungi kuman yang telah dilemahkan atau dimatikan, atau sebahagian kecil daripadanya. Ia cukup untuk melatih badan, tetapi tidak cukup untuk menyebabkan penyakit yang sebenar." Change the label to "vaksin". Why: not all vaccines contain weakened germs, and "tidak berbahaya" is too absolute.
3. **Replace the absolutes.** Where: "Anda tidak sakit." (`077.png` text) and "menang sebelum anda sempat rasa sakit" (lesson 4 closing, `115.png` text). New wording: "biasanya anda tidak sakit, atau sakit jauh lebih ringan" and "biasanya menang sebelum anda sempat sakit teruk". Why: honesty, and so a vaccinated child who still falls ill does not make the nurse a liar.
4. **Add one screen about side effects.** Where: lesson 3, right after "Badan anda tidak sakit, tetapi pengawal mula kenal rupa kuman." New wording: "Selepas disuntik, tempat suntikan mungkin sakit atau anak mungkin demam ringan sehari dua. Itu tanda pengawal sedang berlatih." Why: the first fever is what scares parents, and the lesson currently says the opposite.
5. **Fix the graph and its feedback in lesson 4.**
   - Add a second line or strip that shows how ill each person is (for example "kuman dalam badan"), so the unvaccinated line is not just "slower".
   - Change "Merah turun kerana badan lambat belajar" to "Merah turun kerana jangkitan sudah reda."
   - Change "Pada hari ke-7 ... Merah baru mula naik" to "Merah masih naik."
   - Label the y-axis with words ("rendah / tinggi") instead of 2, 4, 6, 8.
   Why: the current chart lets a sceptic say the two lines end the same, and the feedback contradicts the picture.

**Question box, sources, trust**

6. **Make the answer to "Ask anything about this" visible.** Where: the "lesson done" screen (`123.png`, `125.png`, `127.png`, `137.png`). Show the question and answer in a panel above the keyboard, and scroll to it. Test this screen on a 360x800 phone. Why: the answer was in the page text but never on screen.
7. **Replace the sources for health topics.** Where: the "Sources" block at the bottom of the lesson list (`131.png`). Use KKM, WHO, CDC, or a Malaysian paediatric society page, with the page title and a working link. Do not show GitHub or tool-directory pages as a source for a medical claim. Why: she cannot cite them to a parent, and the German and Russian titles look unprofessional.
8. **Translate and move the disclaimer.** Where: the footer line "ProfAI writes each lesson with AI. It can get things wrong, so check anything important against the sources." New wording: "Pelajaran ini ditulis oleh AI dan mungkin ada kesilapan. Semak perkara penting dengan sumber di bawah atau tanya jururawat/doktor anda." Show it on the first lesson screen, and not only at the bottom of the lesson list. Why: a medical lesson needs the caution where people see it.
9. **Improve the chat answer for worried parents.** Make the model state what vaccines contain (name the main kinds of ingredients in plain words), when a fever needs a clinic (a concrete sign or threshold supplied by a clinician-approved text), and who to ask ("Rujuk jururawat atau doktor di klinik kesihatan"). Why: the current answer says "bukan bahan berbahaya" without saying what is in it, and tells a nurse's audience to "tanya doktor".

**Structure and pace**

10. **Mention the vaccine from the first screen and merge lessons 1 and 2.** Where: lesson 1 opening. New wording: "Vaksin melatih pengawal badan anda sebelum kuman sebenar datang. Mari lihat bagaimana." Compress "kuman dan pengawal" and "reseptor" into one lesson with two tasks. Why: a parent has no patience for 16 screens before the word "vaksin".
11. **Add a one-screen summary with a share button at the end.** Where: after "LESSON 4 DONE" (`137.png`). Four bullet points that cover the whole course, with "Kongsi" (WhatsApp link), "Mula semula" and "Cetak". Why: her goal is to show something to someone else.

**Malay language and interface**

12. **Translate every piece of interface text** (the table in section 3). Where: landing screen, level names, loading steps, feedback openers, buttons, headers, input hints, footer. Why: the lesson is Malay and the controls are English, which looks unfinished.
13. **Unify the touch verb.** Use "Ketik" instead of "Tekan" (`008.png`, `012.png`) and "Seret" for drags. Why: "tekan" suggests a physical button, and the text uses two words for the same action.
14. **Rename the metaphors.**
    - "pengawal" to "askar badan (sel darah putih)", then always the same word.
    - "Pasukan Keselamatan" to "Askar Badan".
    - "Kenali Muka Penjenayah" to "Kenal Rupa Musuh".
    - "gambar muka penjenayah" to "gambar rupa kuman".
    - "Ingatan Yang Kekal" to "Badan Yang Mengingati".
    - "badan sudah hafal" to "badan sudah mengenali kuman itu".
    - "terus kebal" to "terus berimuniti".
    - "Tarik slaid" to "Gerakkan peluncur".
    Why: these are the places where the Malay sounds translated, too heavy, or inaccurate.
15. **Rewrite the lesson-list objectives from the learner's side.** Where: the lesson list (`131.png`). Replace "Menerangkan bahawa..." with "Anda akan tahu bahawa...". Why: it is teacher-note wording.
16. **Use plain Malay for the level choice.** Replace the five English levels with "Untuk saya", "Untuk menerangkan kepada orang lain", plus an optional "Saya sudah tahu asasnya". Why: the learner here is usually not the person being taught.

**Tasks and controls**

17. **Fix the shield task in lesson 1.** Accept any of the four shields, stop the pulse and drift while waiting for the tap, and use targets of at least 48 dp. Why: `014.png` and `016.png`.
18. **Make the notch in lesson 2 findable and add feedback.** A 48 dp target with a pulsing ring, "Belum padan" shown only after a drag, and a hint after a miss. Why: `032.png` to `034.png`.
19. **Make A, B and C look different** (triangle, circle, star), with a notch whose outline matches only one. Why: `042.png`; right now the quiz is a guess.
20. **Let a wrong drag play out.** The bug goes to the notch, bounces back, and says "Tak padan. Bentuknya berbeza." Why: `048.png` and `050.png`.
21. **Replace the 0/1 and decimal sliders** with word steps: "Kuman sebenar | Vaksin" for lesson 3, "Tiada / Sedikit / Cukup" for the training level, whole days for lesson 4. Why: `060.png`, `071.png`, `089.png`.
22. **Make the instruction match the control in lesson 4.** Either make the dashed line draggable, or say "Gerakkan peluncur di bawah". Why: `094.png`, `096.png`.
23. **Make the memory slider usable.** Full-width track, no text selection while dragging, and the chart visibly changes. Why: `108.png`, `111.png`.
24. **Rename "Show me" to "Tunjukkan" and make it animate the answer** rather than skip the task. Why: `036.png`.
25. **Clear or update the feedback banner when the control changes.** Why: `064.png`, where the banner describes a different scene.

**Layout**

26. **Stop labels overlapping.** Use outside labels with leader lines on every canvas, hide a label when its object is not shown, and never print two labels at one spot. Why: `008.png`, `022.png`, `024.png`, `040.png`, `042.png`, `046.png`, `066.png`, `077.png`.
27. **Attach each chart legend pill to its line, and delete the "hari X: merah" readout** or turn it into "Hari ke-7". Why: `084.png`, `086.png`, `089.png`.
28. **Show a loading estimate and a Malay loading text.** "Menyediakan kursus anda... biasanya kira-kira 30 saat". Why: `005.png`, `006.png`.
29. **Make the progress bar consistent** (the same number of segments for every lesson, or none). Why: `064.png` versus `088.png`.
30. **Explain disabled "Continue".** Show "Selesaikan langkah di atas" when it is grey. Why: it looks broken otherwise.

I would be willing to re-test after items 1 to 8 are done. Those are the ones that decide whether a nurse can put this in front of a parent.

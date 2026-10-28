---
topic: learning-science
audience: frank, logan, future prompt writers
summary: What research says about how people learn from interactive visuals, and how each finding shows up in ProfAI's prompts and UI
last_updated: 2026-10-28
---

# How people learn, and what ProfAI does about it

Every claim below comes from a web search on 2026-10-28; the sources are linked. Effect sizes come from reviews and are approximate.

| Finding | Evidence | In ProfAI |
|---|---|---|
| Learning by doing beats watching | Brilliant opens with problems, not explanations ([review](https://upskillwise.com/reviews/brilliant/)). Explorables guide attention instead of dumping the learner in a sandbox ([Red Blob Games, citing Bret Victor](https://redblobgames.com/x/2306-educ432)) | Every step is a task in the scene: slide to a goal, tap, or predict |
| Predict, observe, explain | Meta-analyses (mostly small and regional) report large effects in physics; prediction plus self-explanation in simulations improved test scores ([summary](https://doaj.org/article/f48529423d0b4ed99fdb71dae473b2f3)) | `predict` tasks: the learner commits, then the reveal moves the scene, then the "why" is shown |
| Productive failure | Trying before instruction helps when learners have some prior knowledge (Sinha & Kapur, 53 studies) ([WEF](https://www.weforum.org/stories/education-and-skills/students-who-productively-fail-learn-more/)) | Intermediate level and above: "let them try before telling". Novices get guided tasks (expertise reversal) |
| Spatial contiguity | Words placed next to the picture, d≈0.79 ([Mayer review](https://twut.nd.edu:443/PDF/Principles-MultimediaLearning.pdf)) | The step text sits inside the scene, and callouts pin to the parts |
| Segmenting | Learner-paced segments, d≈0.70 | One idea per step, 4-7 steps, and Continue is the learner's |
| Signaling | Cues to what matters, d≈0.46 | `focus` dims everything else; callouts name the part |
| Coherence | Remove extraneous material, d≈0.70 | No decorative 3D; "draw the thing the words name" |
| Pre-training | Name the parts before the process, d≈0.46 | Step 1 is a tap task that names the key part |
| Learner-controlled animation | More effective than system-controlled ([Red Blob Games](https://redblobgames.com/x/2306-educ432)) | Knobs and draggable points; play and pause; reveals move only after the learner commits |
| Retrieval practice, spacing, interleaving, elaboration, concrete examples, dual coding | The six strategies with the strongest evidence ([WashU](https://ctl.wustl.edu/learningcenter/?p=767)) | The last step states the rule; "why" in every after-text; concrete case first; pictures plus words |
| Learning styles | Matching teaching to a "style" has almost no supporting evidence ([Pashler et al. 2008](https://digitalcommons.usf.edu/psy_facpub/1765/)) | No style matching. Every lesson pairs a picture to act on with short words, which helps everyone |
| 3D helps some learners | 3D and dynamic visuals help low-spatial-ability learners most (Höffler 2010) ([IPN](https://www.leibniz-ipn.de/en/research/publications/spatial-ability-its-influence-on-learning-with-visualizations-a-meta-analytic-review)) | 3D only for real physical objects (`explode-the-machine`) |
| Motion timing | 100-150 ms feedback, 200-300 ms state changes, avoid more than 500 ms ([motion reference](https://git.secluded.site/agent-skills/blob/main/vendor/impeccable/skill/reference/motion-design.md)) | Check pop is a spring of about 220 ms; text crossfade 240 ms; knob glide 700 ms (deliberate, so the change is visible) |
| Working memory | About 4±1 chunks (Cowan) | 3-5 lessons per course; at most 3 callouts per step |

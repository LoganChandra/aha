---
topic: profai-requirements
audience: frank, logan
summary: Every point Logan made about ProfAI, in his words (from voice notes, transcribed), with build status. The build checklist.
last_updated: 2026-10-28
---

# Logan's checklist

His words are quoted from the voice notes; transcription is machine-made. The status column is Frank's, and he checks it against the live site.

## Product

| # | Logan said | Status |
|---|---|---|
| 1 | "a platform that teaches people about AI in a very interactive way ... All levels from novices, all the way to professionals" | in progress |
| 2 | Tutor engine: "you give it any topic ... It determines how to structure the syllabus ... lesson one, lesson two and so on, on the best way to teach a person" | done (Score) |
| 3 | Interactive engine: like Claude's visuals, "very fluid diagrams", "it has to be interactive", "There are knobs. You can interact" | rebuilding (v2 steps) |
| 4 | "This is not supposed to be only for understanding and learning AI ... applied to literally any topic" | in progress |
| 5 | "think of good names for both of these engines ... maybe it can just be one engine" | done (one engine, Score + Stage) |
| 6 | POC UI: "The window to show the interactive learning stuff ... and then just a single prompt box at the bottom" | done |
| 7 | "Deploy it on Vercel" | done: profai-two.vercel.app |
| 8 | "it cannot be janky whatsoever", "What would Apple do" | rebuilding |
| 9 | "Research first. And then build, build, build, think, think, think" | ongoing |
| 10 | Push back and keep recommending something new | ongoing |

## Scale and cost

| # | Logan said | Status |
|---|---|---|
| 11 | "hundreds of thousands of users ... every time a prompt is written, it has to be super duper cheap" | caching + cheap models |
| 12 | "Use all the skills that we learned from how we made IR Assist very cheap ... Ling 3.0 ... dynamic model routing" | bake-off; Ling too unreliable for recipes (8/24) |
| 13 | "don't use [Haiku] five and all these big, big models. It's okay to use very clever, very good Chinese models ... make sure that the quality is there" | DeepSeek V4.1 Flash + GLM 5.3 Flash |
| 14 | "make it affordable, but never ever compromise on quality" | ongoing |
| 15 | Backup model: "use GLM 5.3 Flash for the backup" | done |
| 16 | DeepSeek slug must be exactly `deepseek/deepseek-v4.1-flash` | done, verified |
| 17 | Prompt engineering: "write very elaborate prompts, maybe like 10 different styles of learning, multiple ways to represent ... 10, 20 different learning styles, different visual, interactive methods to teach, brilliant style ... We need to keep this cheap, so using a very smart model to do all of this is not going to cut it" | building the pattern playbook |

## Answers to Frank's questions (2026-10-28)

| # | Logan said | Status |
|---|---|---|
| 18 | First demo: "me and Han, but keep real learners in mind ... always have critiques" | ongoing |
| 19 | "five learner levels, starting from novice ... the final one is professional" | done |
| 20 | Lessons per prompt: "figure that out yourself. Do research" | done (3-5; working-memory research) |
| 21 | "no voice narration" | done |
| 22 | Checks: "make it optional. But not very obvious. If they just want to go to the next lesson, they can" | v2: tasks always have a quiet skip ("Show me") |
| 23 | Sources: yes | done |
| 24 | "they should be able to stop you and ask you questions mid lesson. That's very, very, very important" | done; keep in v2 |
| 25 | "English only for the POC, but it should also handle Malay, Chinese, Tamil, and all the languages in Malaysia" | works (tested) |
| 26 | "mobile first, and then ... desktop, just use all the skills" | ongoing |
| 27 | "3D, whatever, as long as the lesson gets through. You need to be smart about this" | parts library |
| 28 | Use his OpenRouter key; he owns everything; new private repo on his GitHub; name "ProfAI" | done |
| 29 | "Just make it so that I can just put whatever I want ... It has to be robust" | adversarial suites |

## The 2/10 review (2026-10-28, voice note)

| # | Logan said | Status |
|---|---|---|
| 30 | "every single lesson is the exact same. It's just a flowchart and then ... two or three ... sliders ... and then a shitty ass ... description" | rebuild: diagrams only for real processes |
| 31 | "I need the explanation to be within the visualization" | v2: say + callouts inside the scene |
| 32 | "The visualization itself has to be interactive, rather than just me playing around with two sliders" | v2: drag/tap/predict tasks in the scene |
| 33 | "nowhere near a brilliant level. Brilliant actually allows you to ... interact with the visualizations themselves" | v2 |
| 34 | "whenever I change the level of the user, it just becomes way too complicated for anybody" | level rewrite: deeper per step, never denser |
| 35 | "The loading animation is shit. We need to ... make it a lot better" | todo |
| 36 | "The timing of the animations are wrong ... the dots moving between each ... step so quick? There's no timing" | flow dots slowed; timing pass todo |
| 37 | "We have all the skills for this from IR assist. Please use all of your skills" | ongoing |
| 38 | "It's not interactive. It's not ... visually appealing. I'm getting bored learning from this ... it has to be very, very satisfying to learn" | v2: feedback moments |
| 39 | "do way more research ... research more stuff like Brilliant" | done (pass 2), continuing |
| 40 | "in a lot of places, the text between the flowcharts, they're hidden behind the flowchart itself" | diagram labels fixed; guard rails |
| 41 | "I need so many guard rails to make sure that whatever the topic is, it is visually beautiful" | validator + layout guards |
| 42 | "have ... another model to visually inspect it" | todo: vision critic |
| 43 | "it has to be brilliantly done, very beautifully done before we show it to the customer" | gate |
| 44 | "research on how a human ... learns ... multiple different visual tricks ... no matter what kind of learner ... fold everything into the prompts ... extremely thorough ... imaginative, creative ... all research based" | learning-science section in prompts |
| 45 | "Make sure to remember all my points ... that's your checklist" | this file |

## Working style

- Terse Discord updates. Only ping when something is deployed or needs him (2026-10-28, 12:47).
- He tests on desktop in dark mode, and on his phone.

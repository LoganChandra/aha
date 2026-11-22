import type { Level, Plan } from '../recipe';

// Research (the Frank experiment, 2026-10-29): the cheap writer was only as good as its facts. One web-grounded call
// per lesson builds a fact sheet of checkable numbers, names and dates, each with its source.
export const RESEARCH_SYSTEM = `You are the researcher for one AHA lesson. Using the web results you are given (and only well-established knowledge otherwise), return 4 to 7 facts the lesson can be built on.
Each fact: one sentence, concrete and checkable: a number with its unit and date, a named company, product, person, study or event, a formula, or a measured effect. Prefer the most recent figures and say "about" or "estimated" when the source does. No opinions, no vague claims ("AI is growing fast"). If sources disagree, give the range. Include at least one fact for the strongest counter-argument when the topic is debated.
Return ONLY JSON: {"facts":[{"fact":"...","source":"site or publication name","url":"https://..."}]}. Write the facts in English; the writer translates.`;

export function researchUser(plan: Plan, index: number, level: Level): string {
  const l = plan.lessons[index];
  return `Course: ${plan.topic}. Level: ${level}.\nLesson: ${l?.title ?? ''}\nGoal: ${l?.goal ?? ''}\nAha: ${l?.aha ?? ''}\nFind facts about: ${plan.topic}: ${l?.title ?? ''}`;
}

// A country pack: what is true and unique about a place, written once, sourced, and approved by a person.
// The story writer may only pick from a pack. It never invents a fact about a place.
// Packs follow ProfAI's journey map (profai-web src/lib/towns.ts JOURNEYS): one pack per country, one entry per city,
// city 1 is where the lesson is taught, cities 2 to 5 are visited by passing the four tests.
import { z } from 'zod';

/** The real-life problems a traveller solves with an AI prompt. Han, 2026-11-22: hungry, cinema, hotel, a route for Instagram. */
export const NEEDS = ['hungry', 'cinema', 'hotel', 'route'] as const;
export type Need = (typeof NEEDS)[number];

const Url = z.string().url().startsWith('https://');

/** One checkable claim about a place. No source, no fact. */
export const Fact = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  text: z.string().min(8).max(160),
  source: Url,
  /** Date the source was read, so stale facts can be re-checked. */
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Fact = z.infer<typeof Fact>;

/** A scenario: the situation, and the prompt the learner types. The prompt names no facts, so it needs no source. */
export const Scenario = z.object({
  need: z.enum(NEEDS),
  /** One line, plain words: what just happened to the traveller. */
  situation: z.string().min(8).max(120),
  /** What the learner types to the AI. */
  prompt: z.string().min(8).max(200),
  /** Facts from this city that the story may show while solving it. */
  uses: z.array(z.string()).max(3),
});
export type Scenario = z.infer<typeof Scenario>;

export const City = z.object({
  /** Must equal the city name in the journey map. */
  name: z.string().min(2),
  /** What this city is best known for, in 3 to 6 words. Picks the backdrop. */
  backdrop: z.string().min(3).max(60),
  facts: z.array(Fact).min(2),
  scenarios: z.array(Scenario).min(1),
});
export type City = z.infer<typeof City>;

export const Review = z.object({
  status: z.enum(['draft', 'approved']),
  /** Who approved it. Required when approved. Never the AI. */
  by: z.string().nullable(),
  on: z.string().nullable(),
});

export const CountryPack = z.object({
  /** Must equal the journey id in the journey map (japan, korea, thailand, malaysia). */
  journey: z.string().regex(/^[a-z]+$/),
  country: z.string().min(2),
  review: Review,
  cities: z.array(City).length(5),
}).superRefine((p, ctx) => {
  if (p.review.status === 'approved' && (!p.review.by || !p.review.on)) ctx.addIssue({ code: 'custom', message: 'approved pack needs by and on', path: ['review'] });
  for (const [i, c] of p.cities.entries()) {
    const ids = new Set(c.facts.map((f) => f.id));
    if (ids.size !== c.facts.length) ctx.addIssue({ code: 'custom', message: `duplicate fact id in ${c.name}`, path: ['cities', i, 'facts'] });
    for (const s of c.scenarios) for (const u of s.uses) if (!ids.has(u)) ctx.addIssue({ code: 'custom', message: `${c.name}: scenario ${s.need} uses unknown fact ${u}`, path: ['cities', i, 'scenarios'] });
  }
});
export type CountryPack = z.infer<typeof CountryPack>;

/** Lesson 1 opens with the plane landing; the rest of the story comes from the city the learner is in. */
export function usablePack(raw: unknown): CountryPack | null {
  const r = CountryPack.safeParse(raw);
  return r.success && r.data.review.status === 'approved' ? r.data : null;
}
